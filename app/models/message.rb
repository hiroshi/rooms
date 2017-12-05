class Message < ApplicationRecord
  before_save do
    if content
      tags = []
      content.scan(/#(\w+)/) do |tag, _|
        tags << tag
      end
    end
    if tags.present?
      meta[:tags] = tags
    end
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