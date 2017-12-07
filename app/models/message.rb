class Message < ApplicationRecord
  before_save do
    tags = []
    if content
      content.scan(/#(\w+)/) do |tag, _|
        tags << tag
      end
    end
    meta[:tags] = tags
  end

  scope :tags, -> (*tags) {
    return all if tags.blank?
    where('meta->\'tags\' @> ?', tags.to_json)
  }
  scope :no_tags, -> (*tags) {
    return all if tags.blank?
    where('NOT (meta->\'tags\' @> ?) OR (meta->\'tags\' is NULL)', tags.to_json)
  }
end
