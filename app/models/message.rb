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

  scope :query, -> (query) {
    return all if query.blank?
    ts = query.scan(/(?:\s|^)([^\!]\S+)(?:\s|$)/).map {|tag, _| tag }
    q = all.tags(*ts)
    nts = query.scan(/(?:\s|^)\!(\S+)(?:\s|$)/).map {|tag, _| tag }
    q.no_tags(*nts)
  }
end
